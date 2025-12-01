export default function Loading() {
    return (
        <div className="pt-5 mt-4">
            <div className="container">
                {/* Hero Skeleton */}
                <div className="bg-light rounded-3 shadow-sm border p-3 p-md-4 mb-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <div className="placeholder-glow w-75">
                            <span className="placeholder col-12 col-md-8 bg-secondary"></span>
                        </div>
                        <div className="placeholder-glow mt-3 mt-md-0">
                            <span className="placeholder col-4 btn btn-primary disabled"></span>
                        </div>
                    </div>
                </div>

                {/* Filters Skeleton */}
                <div className="mt-4">
                    <div className="d-flex flex-column flex-md-row justify-content-center justify-content-md-between align-items-center mb-3">
                        <div className="placeholder-glow w-25 mb-2 mb-md-0">
                            <span className="placeholder col-12 bg-primary"></span>
                        </div>
                        <div className="btn-group placeholder-glow">
                            <span className="placeholder btn btn-outline-primary disabled col-4"></span>
                            <span className="placeholder btn btn-outline-primary disabled col-4"></span>
                            <span className="placeholder btn btn-outline-primary disabled col-4"></span>
                        </div>
                    </div>

                    {/* Carousel/Grid Skeleton */}
                    <div className="row">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="col-12 col-md-6 col-lg-3 mb-4">
                                <div className="card h-100 shadow-sm" aria-hidden="true">
                                    <div className="placeholder-glow" style={{ height: '150px' }}>
                                        <span className="placeholder col-12 h-100 bg-secondary"></span>
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title placeholder-glow">
                                            <span className="placeholder col-6"></span>
                                        </h5>
                                        <p className="card-text placeholder-glow">
                                            <span className="placeholder col-7"></span>
                                            <span className="placeholder col-4"></span>
                                            <span className="placeholder col-4"></span>
                                            <span className="placeholder col-6"></span>
                                            <span className="placeholder col-8"></span>
                                        </p>
                                        <div className="placeholder-glow mt-auto">
                                            <span className="placeholder col-12 btn btn-primary disabled"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
